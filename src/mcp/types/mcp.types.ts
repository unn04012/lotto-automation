// mcp/interfaces/mcp.interfaces.ts
export type McpToolOptions = {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
};

export type McpResourceOptions = {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
};

export interface McpToolMetadata extends McpToolOptions {
  methodName: string;
  target: any;
}

export interface McpResourceMetadata extends McpResourceOptions {
  methodName: string;
  target: any;
}
