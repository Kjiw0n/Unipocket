export const resolveReportShareUrl = (url: string, origin: string): string =>
  new URL(url, origin).toString();
