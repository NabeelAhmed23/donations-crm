"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Database, Server, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface HealthData {
  service: {
    name: string;
    version: string;
    status: string;
    uptime: number;
    environment: string;
  };
  timing: {
    timestamp: string;
    responseTime: number;
    databaseResponseTime: number;
  };
  database: {
    connection: {
      active: boolean;
      error?: string;
    };
    queries: {
      basic: boolean;
      userCount?: number;
      error?: string;
    };
    stats?: {
      users: number;
      donations: number;
      payments: number;
    };
  };
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: {
      used: number;
      total: number;
      external: number;
    };
  };
  summary: {
    overall: string;
    checks: {
      database: string;
      queries: string;
    };
  };
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/health/detailed");
      const data = await response.json();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch health data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "unhealthy":
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "healthy" || status === "pass" ? "default" 
                  : status === "degraded" ? "secondary" 
                  : "destructive";
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading && !healthData) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8" />
            System Health Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of system components and database connectivity
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={fetchHealthData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Overall Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Service Status</span>
                  {getStatusBadge(healthData.summary.overall)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Environment</span>
                  <Badge variant="outline">{healthData.service.environment}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Version</span>
                  <span className="font-mono">{healthData.service.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uptime</span>
                  <span className="font-mono">{formatUptime(healthData.service.uptime)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Connection</span>
                  {getStatusBadge(healthData.summary.checks.database)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Queries</span>
                  {getStatusBadge(healthData.summary.checks.queries)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Response Time</span>
                  <span className="font-mono">
                    {healthData.timing.databaseResponseTime}ms
                  </span>
                </div>
                {healthData.database.queries.userCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span>User Count</span>
                    <span className="font-mono">{healthData.database.queries.userCount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Response Time</span>
                  <span className="font-mono">{healthData.timing.responseTime}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Memory Used</span>
                  <span className="font-mono">{healthData.system.memory.used}MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Memory Total</span>
                  <span className="font-mono">{healthData.system.memory.total}MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Memory External</span>
                  <span className="font-mono">{healthData.system.memory.external}MB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Statistics */}
          {healthData.database.stats && (
            <Card>
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Total Users</span>
                    <span className="font-mono font-bold">
                      {healthData.database.stats.users.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Donations</span>
                    <span className="font-mono font-bold">
                      {healthData.database.stats.donations.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Payments</span>
                    <span className="font-mono font-bold">
                      {healthData.database.stats.payments.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Node Version</span>
                  <span className="font-mono">{healthData.system.nodeVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Platform</span>
                  <span className="font-mono">{healthData.system.platform}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Architecture</span>
                  <span className="font-mono">{healthData.system.arch}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {(healthData.database.connection.error || healthData.database.queries.error) && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-red-600">Error Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {healthData.database.connection.error && (
                    <div>
                      <strong>Connection Error:</strong>
                      <pre className="mt-1 p-2 bg-red-50 rounded text-sm text-red-800">
                        {healthData.database.connection.error}
                      </pre>
                    </div>
                  )}
                  {healthData.database.queries.error && (
                    <div>
                      <strong>Query Error:</strong>
                      <pre className="mt-1 p-2 bg-red-50 rounded text-sm text-red-800">
                        {healthData.database.queries.error}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}