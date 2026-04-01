import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buildPortfolioOverview } from "@/lib/domain/analytics";
import { getDashboardData } from "@/lib/db/repository";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ instrument?: string }>;
}) {
  const params = await searchParams;
  const data = await getDashboardData();
  const overview = buildPortfolioOverview({
    ...data,
    selectedInstrumentId: params.instrument ?? null,
  });

  return <DashboardShell overview={overview} />;
}
