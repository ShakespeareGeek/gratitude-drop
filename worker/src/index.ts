export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  CORS_ORIGIN: string;
  ADMIN_SECRET: string;
}

interface Note {
  id: number;
  text: string;
  hearts: number;
  dropId: string;
}

interface Submission {
  id: number;
  text: string;
  status: string;
  created: string;
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function getTodayDropId(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHead = corsHeaders(env.CORS_ORIGIN);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHead });
    }

    try {
      if (url.pathname === '/api/drop') {
        return handleGetDrop(request, env, corsHead);
      }
      
      if (url.pathname === '/api/heart' && request.method === 'POST') {
        return handleHeart(request, env, corsHead);
      }
      
      if (url.pathname === '/api/submit' && request.method === 'POST') {
        return handleSubmit(request, env, corsHead);
      }
      
      if (url.pathname === '/admin') {
        return handleAdmin(request, env);
      }

      return new Response('Not Found', { status: 404, headers: corsHead });
    } catch (error) {
      return new Response('Internal Error', { status: 500, headers: corsHead });
    }
  },
};

async function handleGetDrop(request: Request, env: Env, corsHead: HeadersInit): Promise<Response> {
  const dropId = getTodayDropId();
  
  const cached = await env.CACHE.get(`drop_${dropId}`);
  if (cached) {
    return new Response(cached, {
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  }

  const notes = await env.DB.prepare(
    'SELECT id, text, hearts FROM notes WHERE dropId = ?'
  ).bind(dropId).all();

  const response = {
    dropId,
    notes: notes.results || []
  };

  await env.CACHE.put(`drop_${dropId}`, JSON.stringify(response), { expirationTtl: 300 });
  
  return new Response(JSON.stringify(response), {
    headers: { ...corsHead, 'Content-Type': 'application/json' }
  });
}

async function handleHeart(request: Request, env: Env, corsHead: HeadersInit): Promise<Response> {
  const { noteId } = await request.json();
  
  await env.DB.prepare('UPDATE notes SET hearts = hearts + 1 WHERE id = ?')
    .bind(noteId).run();

  const dropId = getTodayDropId();
  await env.CACHE.delete(`drop_${dropId}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHead, 'Content-Type': 'application/json' }
  });
}

async function handleSubmit(request: Request, env: Env, corsHead: HeadersInit): Promise<Response> {
  const { text } = await request.json();
  
  if (!text || text.length > 280) {
    return new Response(JSON.stringify({ error: 'Invalid text length' }), {
      status: 400,
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare('INSERT INTO submissions (text) VALUES (?)')
    .bind(text).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHead, 'Content-Type': 'application/json' }
  });
}

async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const action = url.searchParams.get('action');
  const id = url.searchParams.get('id');

  if (key !== env.ADMIN_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (action === 'approve' && id) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dropId = tomorrow.toISOString().split('T')[0];

    await env.DB.prepare('INSERT OR IGNORE INTO drops (dropId) VALUES (?)').bind(dropId).run();
    
    const submission = await env.DB.prepare('SELECT text FROM submissions WHERE id = ?').bind(id).first();
    if (submission) {
      await env.DB.prepare('INSERT INTO notes (text, dropId) VALUES (?, ?)').bind(submission.text, dropId).run();
      await env.DB.prepare('UPDATE submissions SET status = ? WHERE id = ?').bind('approved', id).run();
    }
    
    return new Response('Approved', { status: 302, headers: { Location: `/admin?key=${key}` } });
  }

  if (action === 'reject' && id) {
    await env.DB.prepare('UPDATE submissions SET status = ? WHERE id = ?').bind('rejected', id).run();
    return new Response('Rejected', { status: 302, headers: { Location: `/admin?key=${key}` } });
  }

  const pending = await env.DB.prepare('SELECT * FROM submissions WHERE status = ?').bind('pending').all();

  const html = `
    <!DOCTYPE html>
    <html><head><title>Admin</title></head><body>
    <h1>Pending Submissions</h1>
    ${pending.results?.map((sub: any) => `
      <div style="border:1px solid #ccc; margin:10px; padding:10px;">
        <p>${sub.text}</p>
        <a href="?key=${key}&action=approve&id=${sub.id}">Approve</a> | 
        <a href="?key=${key}&action=reject&id=${sub.id}">Reject</a>
      </div>
    `).join('') || '<p>No pending submissions</p>'}
    </body></html>
  `;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}