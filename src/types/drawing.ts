export type DrawingTool = 'none' | 'cursor' | 'trendline' | 'horizontal' | 'ray' | 'fibonacci' | 'measure';

export interface ChartPoint {
  x: number;
  y: number;
  price: number;
  candleIndex: number;
}

export interface DrawingItem {
  id: string;
  type: 'trendline' | 'horizontal' | 'ray' | 'fibonacci' | 'measure';
  p1: ChartPoint;
  p2?: ChartPoint;
  color: string;
}
