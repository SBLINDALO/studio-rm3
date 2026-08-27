declare module "web-push" {
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  export function sendNotification(subscription: unknown, payload: string): Promise<unknown>
  const webpush: { setVapidDetails: typeof setVapidDetails; sendNotification: typeof sendNotification }
  export default webpush
}
