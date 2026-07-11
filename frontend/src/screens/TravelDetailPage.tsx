import { useState } from 'react';
import { useParams } from '@tanstack/react-router';

import WidgetList from '@/components/chart/widget/components/WidgetList';
import WidgetPicker from '@/components/chart/widget/components/WidgetPicker';
import { useTravelWidgetManager } from '@/components/chart/widget/hook/useTravelWidgetManager';
import { WidgetContext } from '@/components/chart/widget/WidgetContext';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import BottomSheet from '@/components/layout/BottomSheet';
import ExpandableSheet from '@/components/layout/ExpandableSheet';
import ExpenseTable from '@/components/travel-page/ExpenseTable';
import ImportExpenseTable from '@/components/travel-page/ImportExpenseTable';
import TravelDetailHeader from '@/components/travel-page/TravelDetailHeader';
import { Skeleton } from '@/components/ui/skeleton';

const TravelDetailPage = () => {
  const { travelId } = useParams({ from: '/_app/travel/$travelId' });
  const widgetManager = useTravelWidgetManager(travelId);
  const { isWidgetEditMode } = widgetManager;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false);

  return (
    <WidgetContext.Provider value={widgetManager}>
      <div className="flex h-full flex-col gap-10 px-4 pt-8 xl:px-30">
        <TravelDetailHeader />

        <WidgetList />

        <div className="relative min-h-0 flex-1">
          {isWidgetEditMode ? (
            <ExpandableSheet collapsedHeight="100%" isExpandable={false}>
              <WidgetPicker />
            </ExpandableSheet>
          ) : (
            <ExpandableSheet
              isExpanded={isExpanded}
              onToggleExpand={setIsExpanded}
              collapsedHeight="100%"
              expandedHeight="93vh"
            >
              <QueryBoundary
                pendingFallback={<Skeleton className="h-100 w-full" />}
                errorTitle="지출 내역을 불러오지 못했어요"
              >
                <ExpenseTable
                  onOpenBottomSheet={() => setBottomSheetOpen(true)}
                />
              </QueryBoundary>
            </ExpandableSheet>
          )}
        </div>

        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={() => setBottomSheetOpen(false)}
        >
          <QueryBoundary
            pendingFallback={<Skeleton className="h-100 w-full" />}
            errorTitle="가져올 지출 내역을 불러오지 못했어요"
          >
            <ImportExpenseTable onClose={() => setBottomSheetOpen(false)} />
          </QueryBoundary>
        </BottomSheet>
      </div>
    </WidgetContext.Provider>
  );
};

export default TravelDetailPage;
