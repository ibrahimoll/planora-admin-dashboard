export default function ResponsiveTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}