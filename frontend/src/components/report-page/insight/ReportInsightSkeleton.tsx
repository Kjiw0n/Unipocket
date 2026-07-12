import ReportContainer from '@/components/report-page/layout/ReportContainer';

const ReportInsightSkeleton = () => {
  return (
    <div className="w-full min-w-283">
      <ReportContainer title="AI 소비 인사이트">
        <div className="flex gap-3.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-modal-8 bg-cool-neutral-99 flex min-h-34 flex-1 flex-col justify-between px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <div className="bg-fill-normal rounded-modal-4 h-3 w-16 animate-pulse" />
                <div className="bg-fill-normal rounded-modal-4 h-5 w-14 animate-pulse" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-fill-strong rounded-modal-4 h-5 w-55 animate-pulse" />
                <div className="bg-fill-normal rounded-modal-4 h-4 w-64 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </ReportContainer>
    </div>
  );
};

export default ReportInsightSkeleton;
