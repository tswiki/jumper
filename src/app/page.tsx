
import { DashboardView } from "@/components/dashboard-view"
import { SqlGeneratorView } from "@/components/sql-generator-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Page() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Platform</h2>
      </div>
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sql-generator">SQL Generator</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4">
          <DashboardView />
        </TabsContent>
        <TabsContent value="sql-generator" className="space-y-4">
          <SqlGeneratorView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
