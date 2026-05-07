const adminEmails = new Set(['sarkerramjan2015@gmail.com']);

export function isAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails.has(email));
}
