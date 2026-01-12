interface BarChartProps {
  data: number[];
  height?: number;
  width?: number;
  color?: string;
  showLabels?: boolean;
  labels?: string[];
}

const BLOCK_CHARS = [" ", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex1 = color1.replace("#", "");
  const hex2 = color2.replace("#", "");

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

interface BarSegment {
  char: string;
  color: string;
}

export function BarChart({
  data,
  height = 8,
  width,
  color = "#4A9EFF",
  showLabels = false,
  labels = [],
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <box height={height}>
        <text fg="#666666" content="No data" />
      </box>
    );
  }

  const maxValue = Math.max(...data, 1);
  const chartWidth = width || data.length;
  const barWidth = Math.max(1, Math.floor(chartWidth / data.length));

  const colorLight = color;
  const colorDark = interpolateColor(color, "#1a3a5c", 0.4);

  const rows: BarSegment[][] = [];

  for (let row = height - 1; row >= 0; row--) {
    const rowSegments: BarSegment[] = [];

    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      const normalizedHeight = (value / maxValue) * height;
      const fullBlocks = Math.floor(normalizedHeight);
      const partialBlock = normalizedHeight - fullBlocks;

      let char: string;
      if (row < fullBlocks) {
        char = BLOCK_CHARS[8];
      } else if (row === fullBlocks && partialBlock > 0) {
        const partialIndex = Math.round(partialBlock * 8);
        char = BLOCK_CHARS[Math.min(partialIndex, 8)];
      } else {
        char = " ";
      }

      const barColor = i % 2 === 0 ? colorLight : colorDark;

      for (let w = 0; w < barWidth; w++) {
        rowSegments.push({ char, color: barColor });
      }
    }
    rows.push(rowSegments);
  }

  return (
    <box flexDirection="column" height={showLabels ? height + 1 : height}>
      {rows.map((rowSegments, rowIdx) => (
        <box key={rowIdx} flexDirection="row">
          {rowSegments.map((seg, colIdx) => (
            <text key={colIdx} fg={seg.color} content={seg.char} />
          ))}
        </box>
      ))}
      {showLabels && labels.length > 0 && (
        <box flexDirection="row">
          {labels.map((label, i) => (
            <text
              key={i}
              fg="#666666"
              content={label.padEnd(barWidth * Math.ceil(data.length / labels.length))}
            />
          ))}
        </box>
      )}
    </box>
  );
}

interface MiniBarChartProps {
  data: number[];
  width?: number;
  color?: string;
}

export function MiniBarChart({ data, width = 20, color = "#4A9EFF" }: MiniBarChartProps) {
  if (data.length === 0) {
    return <text fg="#666666" content={" ".repeat(width)} />;
  }

  const maxValue = Math.max(...data, 1);
  let result = "";

  for (let col = 0; col < width; col++) {
    const dataIndex = Math.floor((col / width) * data.length);
    const value = data[dataIndex];
    const normalized = value / maxValue;
    const blockIndex = Math.round(normalized * 8);
    result += BLOCK_CHARS[Math.min(blockIndex, 8)];
  }

  return <text fg={color} content={result} />;
}
