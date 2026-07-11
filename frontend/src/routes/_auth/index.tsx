import { createFileRoute } from '@tanstack/react-router';

import LandingPage from '@/screens/LandingPage';

export const Route = createFileRoute('/_auth/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <LandingPage />;
}
