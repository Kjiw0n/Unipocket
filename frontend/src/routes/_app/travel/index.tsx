import { createFileRoute } from '@tanstack/react-router';

import TravelPage from '@/screens/TravelPage';

export const Route = createFileRoute('/_app/travel/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <TravelPage />;
}
