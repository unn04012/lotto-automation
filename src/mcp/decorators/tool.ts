// mcp/decorators/mcp.decorators.ts
import { MCP_TOOL_METADATA } from '../constants/mcp.constants';
import { McpToolOptions } from '../types/mcp.types';

/**
 * MCP Tool 데코레이터
 * @param options 툴 설정 옵션
 */
export function Tool(options: McpToolOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existingTools = Reflect.getMetadata(MCP_TOOL_METADATA, target.constructor) || [];

    const toolMetadata = {
      ...options,
      methodName: propertyKey as string,
      target: target.constructor,
    };

    existingTools.push(toolMetadata);
    Reflect.defineMetadata(MCP_TOOL_METADATA, existingTools, target.constructor);

    return descriptor;
  };
}
