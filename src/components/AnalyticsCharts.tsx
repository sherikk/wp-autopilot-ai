import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const chartConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--primary))",
  },
  engagement: {
    label: "Engagement",
    color: "hsl(var(--primary-glow))",
  },
  published: {
    label: "Published",
    color: "hsl(var(--success))",
  },
  scheduled: {
    label: "Scheduled", 
    color: "hsl(var(--warning))",
  },
  drafts: {
    label: "Drafts",
    color: "hsl(var(--muted-foreground))",
  },
};

interface PerformanceTrendProps {
  data: Array<{
    date: string;
    views: number;
    engagement: number;
  }>;
}

export const PerformanceTrendChart = ({ data }: PerformanceTrendProps) => {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
  }));

  return (
    <Card className="shadow-elegant border-0">
      <CardHeader>
        <CardTitle>Performance Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="views"
              stroke="var(--color-views)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: "var(--color-views)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="engagement"
              stroke="var(--color-engagement)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: "var(--color-engagement)", strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

interface CampaignPerformanceProps {
  data: Array<{
    name: string;
    published: number;
    scheduled: number;
    drafts: number;
  }>;
}

export const CampaignPerformanceChart = ({ data }: CampaignPerformanceProps) => {
  return (
    <Card className="shadow-elegant border-0">
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <BarChart data={data} barGap={10}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="published"
              fill="var(--color-published)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="scheduled"
              fill="var(--color-scheduled)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="drafts"
              fill="var(--color-drafts)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

interface EngagementBreakdownProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export const EngagementBreakdownChart = ({ data }: EngagementBreakdownProps) => {
  return (
    <Card className="shadow-elegant border-0">
      <CardHeader>
        <CardTitle>Engagement Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};