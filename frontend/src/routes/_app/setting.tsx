import { createFileRoute } from '@tanstack/react-router';

import SettingPage from '@/screens/SettingPage';

export const Route = createFileRoute('/_app/setting')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingPage />;
}
