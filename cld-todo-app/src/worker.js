/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request, env, _ctx) {
		const url = new URL(request.url);
		env.DB.prepare();

		// This is an oversimplified way to do routing
		// Check https://github.com/kwhitley/itty-router for better routing
		if (url.pathname.startsWith('/api/')) {
			// Get form data
			const formData = await request.formData();
			const entries = {};
			for (const entry of formData.entries()) {
				entries[entry[0]] = entry[1];
			}

			if (url.pathname === '/api/todos') {
				// Add todo
				await env.DB.prepare("INSERT INTO todos(description) VALUES(?)").bind(entries['todo']).all();
			} else if (url.pathname === '/api/todos/delete') {
				// Delete todo
				await env.DB.prepare("DELETE FROM todos WHERE ID=?").bind(entries['id']).all();
			}

			return Response.redirect(url.origin, 301);
		}

		// Get all todos
		const {results} = await env.DB.prepare("SELECT * FROM todos").bind().all();

		// Build html file
		// PS: There are lot better ways to do it
		let html = 
		`<!DOCTYPE html>
		<html>
			<body>
				<h1>CLD Todo</h1>

				<form method="POST" action="/api/todos">
					<input type="text" name="todo" required>
					<button type="Submit">Ajouter</button>
				</form>

				<ul>
		`;
		
		results.forEach(todo => {
			html += `<li>` + todo.description + ` <form method="POST" action="/api/todos/delete"><input type="hidden" name="id" value="`+todo.id+`"><button type="submit">Remove</button></form></li>`
		});

		html +=
		`
				</ul>
			</body>
		</html>`;

		return new Response(
			html,
			{ headers: { 'Content-Type': 'text/html' } }
		);
	},
};
