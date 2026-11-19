export function json(data: object, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
  });
}
