import { MCP_RESOURCE_METADATA } from '../constants/mcp.constants';
import { McpResourceOptions } from '../types/mcp.types';

/**
 * MCP Resource 데코레이터
 * @param options 리소스 설정 옵션
 */
export function Resource(options: McpResourceOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existingResources = Reflect.getMetadata(MCP_RESOURCE_METADATA, target.constructor) || [];

    const resourceMetadata = {
      ...options,
      methodName: propertyKey as string,
      target: target.constructor,
    };

    existingResources.push(resourceMetadata);
    Reflect.defineMetadata(MCP_RESOURCE_METADATA, existingResources, target.constructor);

    return descriptor;
  };
}
