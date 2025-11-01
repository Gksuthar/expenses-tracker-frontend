import { CheckSquare, DollarSign, TrendingUp, Clock, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery } from "@tanstack/react-query";
import API from "@/lib/axios-client";
import { Progress } from "@/components/ui/progress";
import { TaskType } from "@/types/api.type";

const WorkspaceDashboard = () => {
  const workspaceId = useWorkspaceId();

  // Fetch tasks analytics
  const { data: tasksData } = useQuery({
    queryKey: ["tasks-analytics", workspaceId],
    queryFn: async () => {
      const { data } = await API.get(`/task/workspace/${workspaceId}/all?pageSize=1000`);
      return data;
    },
    enabled: !!workspaceId,
  });

  // Fetch expenses analytics
  const { data: expensesData } = useQuery({
    queryKey: ["expenses-analytics", workspaceId],
    queryFn: async () => {
      const { data } = await API.get(`/expense/workspace/${workspaceId}/all`);
      return data;
    },
    enabled: !!workspaceId,
  });

  const tasks: TaskType[] = tasksData?.tasks || [];
  const pendingTasks = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS" || t.status === "BACKLOG" || t.status === "IN_REVIEW").length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const budgetUsed = expensesData?.analytics?.usedBudget || 0;
  
  // Calculate overdue tasks
  const now = new Date();
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "DONE") return false;
    return new Date(t.dueDate) < now;
  }).length;

  // Recent activities (mock for now)
  const recentActivities = [
    { type: "task", title: "Foundation Excavation", action: "completed", time: "2 hours ago" },
    { type: "expense", title: "Steel Rods Purchase", action: "added", time: "4 hours ago" },
    { type: "task", title: "Electrical Planning", action: "created", time: "1 day ago" },
    { type: "project", title: "Commercial Plaza", action: "status updated", time: "2 days ago" },
  ];

  // Upcoming deadlines
  const upcomingDeadlines = tasks
    .filter((t) => t.dueDate && t.status !== "DONE")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Expense distribution
  const expenseDistribution = expensesData?.analytics?.categoryDistribution || {};
  const hasExpenses = Object.keys(expenseDistribution).length > 0;

  return (
    <main className="flex flex-1 flex-col py-4 md:pt-3 pb-10">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            {overdueTasks > 0 && (
              <p className="text-xs text-red-600 mt-1">{overdueTasks} overdue</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{budgetUsed.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">On Track</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Left</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Expense Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Expense Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasExpenses ? (
              <div className="space-y-3">
                {Object.entries(expenseDistribution).map(([category, amount]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{category}</span>
                      <span className="font-medium">₹{(amount as number).toFixed(0)}</span>
                    </div>
                    <Progress 
                      value={((amount as number) / budgetUsed) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>To Do:</span>
                  <span className="font-medium">{todoTasks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>In Progress:</span>
                  <span className="font-medium">{inProgressTasks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Completed:</span>
                  <span className="font-medium">{completedTasks}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((task) => (
                  <div key={task._id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <span className="font-medium truncate flex-1">{task.title}</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming deadlines
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    activity.type === "task" ? "bg-blue-600" :
                    activity.type === "expense" ? "bg-green-600" :
                    activity.type === "project" ? "bg-purple-600" : "bg-gray-600"
                  }`} />
                  <div className="flex-1">
                    <p>
                      <span className="font-medium">{activity.type === "task" ? "Task" : activity.type === "expense" ? "Expense" : "Project"} {activity.action}:</span>{" "}
                      <span className="text-blue-600">{activity.title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default WorkspaceDashboard;
