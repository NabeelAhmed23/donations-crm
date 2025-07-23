import { checkDatabaseHealth } from "@/lib/db-health";

// HTML health check page for browsers and monitoring tools
export const runtime = "nodejs";

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    const timestamp = new Date().toISOString();

    const statusColor =
      dbHealth.status === "healthy"
        ? "#10b981"
        : dbHealth.status === "degraded"
        ? "#f59e0b"
        : "#ef4444";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donations System Health</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            color: #334155;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            color: white;
            background-color: ${statusColor};
            margin-left: 10px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
        }
        .card h3 {
            margin: 0 0 15px 0;
            color: #1e293b;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .metric:last-child {
            margin-bottom: 0;
        }
        .value {
            font-weight: 600;
            font-family: monospace;
        }
        .error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .error h3 {
            color: #dc2626;
            margin: 0 0 10px 0;
        }
        .timestamp {
            text-align: center;
            margin-top: 30px;
            color: #64748b;
            font-size: 14px;
        }
        .refresh-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 10px;
        }
        .refresh-btn:hover {
            background: #2563eb;
        }
    </style>
    <script>
        function refreshPage() {
            window.location.reload();
        }
        
        // Auto-refresh every 30 seconds
        setTimeout(function() {
            window.location.reload();
        }, 30000);
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Donations System Health Check</h1>
            <p>Real-time system monitoring and database connectivity status</p>
            <span class="status">${dbHealth.status.toUpperCase()}</span>
            <button class="refresh-btn" onclick="refreshPage()">Refresh</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 Overall Status</h3>
                <div class="metric">
                    <span>System Status:</span>
                    <span class="value">${dbHealth.status}</span>
                </div>
                <div class="metric">
                    <span>Response Time:</span>
                    <span class="value">${dbHealth.responseTime}ms</span>
                </div>
                <div class="metric">
                    <span>Environment:</span>
                    <span class="value">${
                      process.env.NODE_ENV || "unknown"
                    }</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🗄️ Database</h3>
                <div class="metric">
                    <span>Connection:</span>
                    <span class="value">${
                      dbHealth.connection.active ? "Connected" : "Disconnected"
                    }</span>
                </div>
                <div class="metric">
                    <span>Basic Queries:</span>
                    <span class="value">${
                      dbHealth.queries.basic ? "Working" : "Failed"
                    }</span>
                </div>
                ${
                  dbHealth.queries.userCount !== undefined
                    ? `
                <div class="metric">
                    <span>User Count:</span>
                    <span class="value">${dbHealth.queries.userCount}</span>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        
        ${
          dbHealth.connection.error || dbHealth.queries.error
            ? `
        <div class="error">
            <h3>⚠️ Error Details</h3>
            ${
              dbHealth.connection.error
                ? `<p><strong>Connection:</strong> ${dbHealth.connection.error}</p>`
                : ""
            }
            ${
              dbHealth.queries.error
                ? `<p><strong>Queries:</strong> ${dbHealth.queries.error}</p>`
                : ""
            }
        </div>
        `
            : ""
        }
        
        <div class="timestamp">
            Last updated: ${timestamp}<br>
            Auto-refresh in 30 seconds
        </div>
    </div>
</body>
</html>`;

    const httpStatus =
      dbHealth.status === "healthy"
        ? 200
        : dbHealth.status === "degraded"
        ? 200
        : 503;

    return new Response(html, {
      status: httpStatus,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Check Error</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #fee; }
        .error { background: white; padding: 20px; border-radius: 8px; border: 2px solid #f87171; }
    </style>
</head>
<body>
    <div class="error">
        <h1>🚨 Health Check Failed</h1>
        <p><strong>Error:</strong> ${
          error instanceof Error ? error.message : "Unknown error"
        }</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <button onclick="window.location.reload()">Retry</button>
    </div>
</body>
</html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
