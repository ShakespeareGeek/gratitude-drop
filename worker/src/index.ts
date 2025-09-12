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
  const now = new Date();
  
  // Correctly get Eastern timezone date and hour
  const easternDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  });
  const easternHourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false
  });
  
  const easternDate = easternDateFormatter.format(now);  // YYYY-MM-DD format
  const easternHour = parseInt(easternHourFormatter.format(now));
  
  // TRANSITION LOGIC: If we're between now and 5am tomorrow, extend current drop
  // This prevents notes from losing hours during the timezone fix
  if (easternHour >= 21) { // 9pm or later - extend today's drop until 5am day after tomorrow (full 24+ hours)
    return easternDate;
  } else if (easternHour < 5) { // Before 5am - show yesterday's drop 
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).format(yesterday);
  } else { // 5am-9pm - normal current day drop
    return easternDate;
  }
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
      
      if (url.pathname.startsWith('/api/note/') && request.method === 'GET') {
        return handleGetNote(request, env, corsHead);
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

async function ensureTodayDropExists(env: Env): Promise<void> {
  const dropId = getTodayDropId();
  
  // Check if today's drop already has exactly 5 notes
  const existingNotes = await env.DB.prepare('SELECT COUNT(*) as count FROM notes WHERE dropId = ?').bind(dropId).first();
  const currentCount = existingNotes?.count || 0;
  
  if (currentCount >= 5) {
    return; // Drop already complete with 5+ notes
  }
  
  // Calculate how many more notes we need (up to 5 total)
  const needed = 5 - currentCount;
  
  // Get the next highest priority approved submissions (lowest sort_order = highest priority)
  const approvedNotes = await env.DB.prepare(
    'SELECT id, text FROM submissions WHERE status = ? ORDER BY sort_order ASC LIMIT ?'
  ).bind('approved', needed).all();
  
  if (approvedNotes.results && approvedNotes.results.length > 0) {
    // Ensure drop exists
    await env.DB.prepare('INSERT OR IGNORE INTO drops (dropId) VALUES (?)').bind(dropId).run();
    
    // Move approved submissions to notes table
    for (const submission of approvedNotes.results) {
      await env.DB.prepare('INSERT INTO notes (text, dropId, hearts) VALUES (?, ?, 0)')
        .bind(submission.text, dropId).run();
      
      // Mark as used
      await env.DB.prepare('UPDATE submissions SET status = ? WHERE id = ?')
        .bind('used', submission.id).run();
    }
  }
}

async function handleGetDrop(request: Request, env: Env, corsHead: HeadersInit): Promise<Response> {
  const dropId = getTodayDropId();
  
  const cached = await env.CACHE.get(`drop_${dropId}`);
  if (cached) {
    return new Response(cached, {
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  }

  // Ensure today's drop is populated from the priority queue
  await ensureTodayDropExists(env);

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
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  
  // Check rate limit: 5 submissions per IP per hour
  const rateLimitKey = `rate_limit_${clientIP}`;
  const submissions = await env.CACHE.get(rateLimitKey);
  
  let submissionTimes: number[] = [];
  if (submissions) {
    submissionTimes = JSON.parse(submissions).filter((time: number) => time > hourAgo);
  }
  
  if (submissionTimes.length >= 5) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  }

  const { text } = await request.json();
  
  if (!text || text.length > 280) {
    return new Response(JSON.stringify({ error: 'Invalid text length' }), {
      status: 400,
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare('INSERT INTO submissions (text) VALUES (?)')
    .bind(text).run();

  // Send ntfy notification
  try {
    await fetch('https://ntfy.sh/5vkbgcxwN0iZFVrB', {
      method: 'POST',
      headers: {
        'Title': 'New Gratitude Submission',
        'Tags': 'gratitude,heart',
        'Priority': '3'
      },
      body: `New submission received:\n\n"${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`
    });
  } catch (error) {
    // Don't fail submission if notification fails
    console.error('Failed to send ntfy notification:', error);
  }

  // Update rate limit
  submissionTimes.push(now);
  await env.CACHE.put(rateLimitKey, JSON.stringify(submissionTimes), { expirationTtl: 3600 });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHead, 'Content-Type': 'application/json' }
  });
}

async function handleGetNote(request: Request, env: Env, corsHead: HeadersInit): Promise<Response> {
  const url = new URL(request.url);
  const noteId = url.pathname.split('/').pop();
  
  if (!noteId || isNaN(Number(noteId))) {
    return new Response(JSON.stringify({ error: 'Invalid note ID' }), {
      status: 400,
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  }

  try {
    const note = await env.DB.prepare('SELECT id, text, hearts FROM notes WHERE id = ?')
      .bind(Number(noteId)).first();

    if (!note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
        headers: { ...corsHead, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(note), {
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch note' }), {
      status: 500,
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  }
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
    const currentPage = parseInt(url.searchParams.get('page') || '1');
    
    // Get the highest sort_order and add 1 (append to end)
    const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) as max FROM submissions WHERE status = ?').bind('approved').first();
    const newSortOrder = (maxOrder?.max || 0) + 1;
    
    await env.DB.prepare('UPDATE submissions SET status = ?, sort_order = ? WHERE id = ?')
      .bind('approved', newSortOrder, id).run();
    
    // Check if current page will be empty after this action
    const remainingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM submissions WHERE status = ?').bind('pending').first();
    const totalRemaining = (remainingCount?.count || 0) - 1; // Subtract the one we just processed
    const maxPage = Math.ceil(totalRemaining / 10) || 1;
    const redirectPage = Math.min(currentPage, maxPage);
    
    return new Response('Approved', { status: 302, headers: { Location: `/admin?key=${key}&page=${redirectPage}` } });
  }

  if (action === 'reject' && id) {
    const currentPage = parseInt(url.searchParams.get('page') || '1');
    await env.DB.prepare('UPDATE submissions SET status = ? WHERE id = ?').bind('rejected', id).run();
    
    // Check if current page will be empty after this action
    const remainingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM submissions WHERE status = ?').bind('pending').first();
    const totalRemaining = (remainingCount?.count || 0) - 1; // Subtract the one we just processed
    const maxPage = Math.ceil(totalRemaining / 10) || 1;
    const redirectPage = Math.min(currentPage, maxPage);
    
    return new Response('Rejected', { status: 302, headers: { Location: `/admin?key=${key}&page=${redirectPage}` } });
  }

  if (action === 'unapprove' && id) {
    await env.DB.prepare('UPDATE submissions SET status = ?, sort_order = NULL WHERE id = ?')
      .bind('pending', id).run();
    
    return new Response('Unapproved', { status: 302, headers: { Location: `/admin?key=${key}` } });
  }

  if (action === 'reorder' && request.method === 'POST') {
    const { noteIds } = await request.json();
    
    // Update sort_order for each note based on new position
    for (let i = 0; i < noteIds.length; i++) {
      await env.DB.prepare('UPDATE submissions SET sort_order = ? WHERE id = ?')
        .bind(i + 1, noteIds[i]).run();
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = 10;
  const offset = (page - 1) * perPage;
  
  const pendingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM submissions WHERE status = ?').bind('pending').first();
  const pending = await env.DB.prepare('SELECT * FROM submissions WHERE status = ? ORDER BY created DESC LIMIT ? OFFSET ?')
    .bind('pending', perPage, offset).all();
  
  const approved = await env.DB.prepare('SELECT * FROM submissions WHERE status = ? ORDER BY sort_order ASC LIMIT 20').bind('approved').all();
  
  const totalPending = pendingCount?.count || 0;
  const totalPages = Math.ceil(totalPending / perPage);
  
  // Redirect to page 1 if trying to access a page that doesn't exist
  if (page > totalPages && totalPages > 0) {
    return new Response('Redirect', { status: 302, headers: { Location: `/admin?key=${key}&page=1` } });
  }

  const html = `
    <!DOCTYPE html>
    <html><head>
    <meta charset="UTF-8">
    <title>Admin - Gratitude Drop</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .section { margin-bottom: 30px; }
      .submission { border: 1px solid #ccc; margin: 10px 0; padding: 15px; border-radius: 5px; }
      .action-buttons a { margin-right: 10px; padding: 5px 10px; text-decoration: none; border-radius: 3px; color: white; }
      .approve { background: #059669; }
      .reject { background: #dc2626; }
      .sortable { cursor: move; }
      .dragging { opacity: 0.5; }
      .approved { background: #f0fdf4; border-color: #22c55e; }
      .priority { font-weight: bold; }
      .queue-info { background: #eff6ff; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style></head><body>
    
    <h1>Gratitude Drop Admin</h1>
    
    <div class="queue-info">
      <strong>Approved Queue:</strong> ${approved.results?.length || 0} notes ready
      <br><strong>Next 5 drops:</strong> Will be filled from highest priority notes
    </div>

    <div class="section">
      <h2>Pending Submissions (${totalPending} total)</h2>
      
      ${totalPages > 1 ? `
        <div style="margin-bottom: 20px;">
          <strong>Page ${page} of ${totalPages}</strong>
          ${page > 1 ? `<a href="?key=${key}&page=${page - 1}" style="margin-left: 10px;">&laquo; Previous</a>` : ''}
          ${page < totalPages ? `<a href="?key=${key}&page=${page + 1}" style="margin-left: 10px;">Next &raquo;</a>` : ''}
        </div>
      ` : ''}
      
      ${pending.results?.map((sub: any) => `
        <div class="submission">
          <p><strong>ID ${sub.id}:</strong> &ldquo;${sub.text.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}&rdquo;</p>
          <div class="action-buttons">
            <a href="?key=${key}&action=approve&id=${sub.id}&page=${page}" class="approve">Approve</a>
            <a href="?key=${key}&action=reject&id=${sub.id}&page=${page}" class="reject">Reject</a>
          </div>
        </div>
      `).join('') || '<p>No pending submissions</p>'}
      
      ${totalPages > 1 ? `
        <div style="margin-top: 20px;">
          ${page > 1 ? `<a href="?key=${key}&page=${page - 1}">&laquo; Previous</a>` : ''}
          ${page < totalPages ? `<a href="?key=${key}&page=${page + 1}" style="margin-left: 10px;">Next &raquo;</a>` : ''}
        </div>
      ` : ''}
    </div>

    <div class="section">
      <h2>Approved Queue (${approved.results?.length || 0}) - Drag to Reorder</h2>
      <p style="color: #666; font-size: 14px;">Drag notes up/down to prioritize them. Top notes will appear in drops first.</p>
      
      <div id="approved-list">
        ${approved.results?.map((sub: any, index: number) => `
          <div class="submission approved sortable" data-id="${sub.id}" draggable="true">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; flex-grow: 1;">
                <span style="margin-right: 10px; color: #666;">≡</span>
                <div>
                  <p><strong>Queue #${index + 1}</strong></p>
                  <p>&ldquo;${sub.text.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}&rdquo;</p>
                  <small>Approved: ${new Date(sub.created).toLocaleDateString()}</small>
                </div>
              </div>
              <div style="margin-left: 15px;">
                <a href="?key=${key}&action=unapprove&id=${sub.id}" 
                   class="reject" 
                   onclick="return confirm('Move this note back to pending?')"
                   style="font-size: 12px; padding: 3px 8px;">
                  Unapprove
                </a>
              </div>
            </div>
          </div>
        `).join('') || '<p>No approved submissions</p>'}
      </div>
    </div>

    <script>
      let draggedElement = null;
      
      const approvedList = document.getElementById('approved-list');
      if (approvedList) {
        approvedList.addEventListener('dragstart', (e) => {
          // Find the closest sortable element
          const sortableElement = e.target.closest('.sortable');
          if (sortableElement) {
            draggedElement = sortableElement;
            sortableElement.classList.add('dragging');
          }
        });
        
        approvedList.addEventListener('dragend', (e) => {
          if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
          }
        });
        
        approvedList.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });
        
        approvedList.addEventListener('drop', (e) => {
          e.preventDefault();
          if (!draggedElement) return;
          
          // Find the closest sortable element to drop on
          const dropTarget = e.target.closest('.sortable');
          if (dropTarget && dropTarget !== draggedElement) {
            const rect = dropTarget.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
              approvedList.insertBefore(draggedElement, dropTarget);
            } else {
              approvedList.insertBefore(draggedElement, dropTarget.nextSibling);
            }
            
            saveNewOrder();
          }
        });
      }
      
      function saveNewOrder() {
        const items = Array.from(document.querySelectorAll('.sortable'));
        const noteIds = items.map(item => parseInt(item.dataset.id));
        
        console.log('Saving new order:', noteIds);
        
        fetch('/admin?key=${key}&action=reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteIds })
        })
        .then(response => response.json())
        .then(data => {
          console.log('Reorder response:', data);
          if (data.success) {
            // Update queue numbers
            items.forEach((item, index) => {
              const queueNum = item.querySelector('strong');
              if (queueNum) queueNum.textContent = \`Queue #\${index + 1}\`;
            });
          }
        })
        .catch(error => {
          console.error('Error saving order:', error);
        });
      }
    </script>

    </body></html>
  `;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}