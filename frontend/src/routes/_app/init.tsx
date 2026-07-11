import { createFileRoute } from '@tanstack/react-router';

import InitPage from '@/screens/InitPage';

export const Route = createFileRoute('/_app/init')({
  component: RouteComponent,
});

function RouteComponent() {
  return <InitPage />;
}
