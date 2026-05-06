export async function broadcastPush(
  _title: string,
  _body: string,
  _data?: Record<string, unknown>
): Promise<{ sent: number; errors: number }> {
  return { sent: 0, errors: 0 };
}
