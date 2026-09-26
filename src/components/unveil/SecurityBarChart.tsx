import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

interface AlertsByDayItem {
  day: string;
  low: number;
  medium: number;
  high: number;
}

export default function SecurityBarChart({ data }: { data: AlertsByDayItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "#A8A29E", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#A8A29E", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: "rgba(25, 25, 28, 0.92)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            fontSize: 12,
            backdropFilter: "blur(12px)",
          }}
          cursor={{ fill: "rgba(212, 175, 55, 0.06)" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#A8A29E" }} />
        <Bar dataKey="low" name="Low" stackId="a" fill="#57534E" />
        <Bar dataKey="medium" name="Medium" stackId="a" fill="#78350F" />
        <Bar dataKey="high" name="High" stackId="a" fill="#7F1D1D" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
