// This middleware handles SPA routing
// API routes are handled by their specific function files
// All other routes fall through to serve the SPA

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // Let API routes pass to their handlers
  if (url.pathname.startsWith('/api/')) {
    return context.next();
  }

  // For all other routes, try to serve the static asset first
  try {
    const response = await context.next();
    // If the asset was found, return it
    if (response.status !== 404) {
      return response;
    }
  } catch {
    // Fall through to SPA
  }

  // For 404s, serve index.html (SPA routing)
  const assetUrl = new URL('/index.html', context.request.url);
  const request = new Request(assetUrl.toString(), context.request);
  try {
    return await context.env.ASSETS.fetch(request);
  } catch {
    return new Response('Not Found', { status: 404 });
  }
};
