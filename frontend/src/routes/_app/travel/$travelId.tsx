import { createFileRoute } from '@tanstack/react-router';

import TravelDetailPage from '@/screens/TravelDetailPage';

export const Route = createFileRoute('/_app/travel/$travelId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <TravelDetailPage />;
}
