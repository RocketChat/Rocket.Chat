import { MCPClient } from '@modelcontextprotocol/sdk'; // Hypothetical SDK usage

export interface MCPConfig {
	serverId: string;
	url: string;
	enabled: boolean;
}

class MCPGatewayService {
	private clients: Map<string, any> = new Map();

	/**
	 * Connects to a new MCP server provided by the user/admin
	 */
	public async connectServer(config: MCPConfig): Promise<void> {
		if (!config.enabled) return;

		try {
			// Initialize connection to the remote MCP server
			const client = new MCPClient({ url: config.url });
			await client.connect();
			
			this.clients.set(config.serverId, client);
			console.log(`[MCP] Connected to server: ${config.serverId}`);
		} catch (error) {
			console.error(`[MCP] Connection failed for ${config.serverId}:`, error);
		}
	}

	/**
	 * Lists available tools from all connected MCP servers
	 */
	public async getAllTools() {
		const allTools = [];
		for (const client of this.clients.values()) {
			const tools = await client.listTools();
			allTools.push(...tools);
		}
		return allTools;
	}
}

export const mcpGatewayService = new MCPGatewayService();
