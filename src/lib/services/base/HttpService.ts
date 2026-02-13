/**
 * Base class for all HTTP-based service integrations
 *
 * Provides:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Response validation
 * - Error normalization
 * - Health check caching
 */

export interface ServiceConfig {
  url: string;
  apiKey?: string;
  timeout?: number; // Default: 10 seconds
  retries?: number; // Default: 3
  retryDelay?: number; // Default: 1000ms (exponential backoff)
  headers?: Record<string, string>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number; // Response time in ms
  version?: string; // Service version if available
}

export interface ServiceStatus {
  online: boolean;
  healthy: boolean;
  message?: string;
  lastChecked: Date;
  metrics?: {
    uptime?: number;
    requestCount?: number;
    errorRate?: number;
  };
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public serviceName?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export abstract class HttpService {
  protected config: ServiceConfig;
  private healthCheckCache: {
    status: ServiceStatus | null;
    timestamp: number;
  } = {
    status: null,
    timestamp: 0,
  };
  private readonly HEALTH_CHECK_TTL = 30000; // Cache health checks for 30s

  constructor(config: ServiceConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Make an HTTP request with automatic retry and error handling
   */
  protected async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.config.url}${endpoint}`;
    const timeout = options.timeout ?? this.config.timeout ?? 10000;
    const maxRetries = options.retries ?? this.config.retries ?? 3;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Prepare headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...options.headers,
        };

        // Add API key if configured
        if (this.config.apiKey) {
          headers['X-Api-Key'] = this.config.apiKey;
          // Some services use different header names
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        // Make request
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch {
            // Error body is not JSON, use raw text if short enough
            if (errorBody.length < 200) {
              errorMessage += ` - ${errorBody}`;
            }
          }

          // Determine if error is retryable
          const isRetryable =
            response.status >= 500 || // Server errors
            response.status === 429 || // Rate limited
            response.status === 408; // Request timeout

          throw new ServiceError(
            errorMessage,
            response.status,
            this.constructor.name,
            isRetryable
          );
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        } else {
          // Return text for non-JSON responses
          return (await response.text()) as T;
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry if:
        // 1. It's the last attempt
        // 2. It's not a retryable error
        // 3. It's a client error (4xx except 429, 408)
        if (attempt === maxRetries) {
          break;
        }

        if (error instanceof ServiceError && !error.retryable) {
          break;
        }

        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error - retryable
        } else if (error instanceof Error && error.name === 'AbortError') {
          // Timeout - retryable
        } else if (error instanceof ServiceError && error.statusCode && error.statusCode < 500 && error.statusCode !== 429 && error.statusCode !== 408) {
          // Client error (non-retryable)
          break;
        }

        // Wait before retry with exponential backoff
        const delay = (this.config.retryDelay ?? 1000) * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    if (lastError instanceof ServiceError) {
      throw lastError;
    } else if (lastError instanceof Error && lastError.name === 'AbortError') {
      throw new ServiceError(
        `Request timeout after ${timeout}ms`,
        408,
        this.constructor.name,
        true
      );
    } else if (lastError instanceof TypeError) {
      throw new ServiceError(
        `Network error: ${lastError.message}`,
        0,
        this.constructor.name,
        true
      );
    } else {
      throw new ServiceError(
        lastError?.message || 'Unknown error',
        0,
        this.constructor.name,
        false
      );
    }
  }

  /**
   * Test connection to the service
   * Must be implemented by each service
   */
  abstract testConnection(): Promise<ConnectionTestResult>;

  /**
   * Get current service status with caching
   */
  async getStatus(): Promise<ServiceStatus> {
    const now = Date.now();

    // Return cached status if still valid
    if (
      this.healthCheckCache.status &&
      now - this.healthCheckCache.timestamp < this.HEALTH_CHECK_TTL
    ) {
      return this.healthCheckCache.status;
    }

    // Perform health check
    try {
      const result = await this.testConnection();
      const status: ServiceStatus = {
        online: result.success,
        healthy: result.success,
        message: result.message,
        lastChecked: new Date(),
      };

      // Cache the result
      this.healthCheckCache = {
        status,
        timestamp: now,
      };

      return status;
    } catch (error) {
      const status: ServiceStatus = {
        online: false,
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };

      // Cache the error result too (but with shorter TTL via timestamp)
      this.healthCheckCache = {
        status,
        timestamp: now - this.HEALTH_CHECK_TTL + 5000, // Expire in 5s instead of 30s
      };

      return status;
    }
  }

  /**
   * Clear the health check cache (useful after configuration changes)
   */
  protected clearHealthCheckCache(): void {
    this.healthCheckCache = {
      status: null,
      timestamp: 0,
    };
  }
}
