import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function LiveChart({ data, label, color, unit, maxPoints = 30, height = '180px' }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          label: label,
          data: data.slice(-maxPoints),
          borderColor: color,
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: color,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(6, 10, 20, 0.9)',
            titleColor: '#f0f4f8',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (ctx) => `${label}: ${ctx.parsed.y} ${unit || ''}`,
            },
          },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            grid: {
              color: 'rgba(148, 163, 184, 0.06)',
              drawBorder: false,
            },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              maxTicksLimit: 5,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, label, color, unit, maxPoints]);

  return (
    <div style={{ height: typeof height === 'number' ? `${height}px` : height, position: 'relative', width: '100%' }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
