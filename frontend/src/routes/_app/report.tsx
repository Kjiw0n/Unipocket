import { createFileRoute } from '@tanstack/react-router';

import ReportPage from '@/screens/report-page/ReportPage';

export const Route = createFileRoute('/_app/report')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ReportPage />;
}
