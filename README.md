# B2BLeads MCP Server

An [MCP](https://modelcontextprotocol.io) (Model Context Protocol) server that gives AI agents — Claude, Cursor, and any other MCP-compatible client — a `search_leads` tool for real-time B2B company discovery and enrichment.

Ask your agent things like:

> "Find construction companies in Munich with a website and phone number."
>
> "Collect 50 IT companies in Berlin rated above 4.0."
>
> "Enrich this lead list with email contacts where available."

...and it calls this tool to return a ready-made list of companies: name, address, phone, website, rating, and email where available.

This server is a thin MCP wrapper around the [B2BLeads](https://b2bleadsapi.com) REST API. You need a B2BLeads account and API key — see [Getting an API key](#getting-an-api-key) below.

## Requirements

- Node.js 18 or later
- A B2BLeads API key ([sign up](https://b2bleadsapi.com/login))

## Installation

No install needed — run it directly with `npx`. Add it to your MCP client's config:

### Claude Desktop / Claude Code

Edit your `claude_desktop_config.json` (or run `claude mcp add`):

```json
{
  "mcpServers": {
    "b2bleads": {
      "command": "npx",
      "args": ["-y", "b2bleads-mcp"],
      "env": {
        "B2BLEADS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor

Add the same block to `.cursor/mcp.json` in your project (or your global Cursor MCP settings).

### Any other MCP client

Point it at the command `npx -y b2bleads-mcp` with the `B2BLEADS_API_KEY` environment variable set.

## Getting an API key

1. Create an account at [b2bleadsapi.com](https://b2bleadsapi.com/login).
2. Pick a plan in **Billing**.
3. Generate a key under **API Keys** in the dashboard.
4. Set it as `B2BLEADS_API_KEY` in your MCP client config (see above).

## Tools

### `search_leads`

Search for companies and business contacts in real time.

| Parameter       | Type      | Description                                                                 |
| --------------- | --------- | ----------------------------------------------------------------------------- |
| `q`              | string    | Free-text query, e.g. `"construction companies in Munich"`.                  |
| `industry`       | string    | One of the categories from `list_industries`.                                |
| `city`           | string    | City or region to search in.                                                 |
| `radius_km`      | number    | Search radius in kilometers.                                                 |
| `min_rating`     | number    | Minimum rating (0-5).                                                        |
| `has_website`    | boolean   | Only businesses with a website.                                              |
| `verified_only`  | boolean   | Only businesses with a verified listing.                                     |
| `open_now`       | boolean   | Only businesses currently open.                                              |
| `price_level`    | string    | `budget` \| `moderate` \| `expensive` \| `luxury`                            |
| `rank_by`        | string    | `relevance` \| `distance`                                                    |
| `limit`          | integer   | Max results per call, 1-20.                                                  |
| `lang`           | string    | Result language, BCP-47 tag (e.g. `en`, `pt-BR`).                            |
| `page_token`     | string    | Pagination token from a previous call.                                       |
| `save_to_list`   | boolean   | Also save results into a B2BLeads saved list.                                |
| `list_id`        | string    | Existing saved-list ID to append to.                                         |
| `list_name`      | string    | Saved-list name to find-or-create and append to.                             |

At least one of `q`, `industry`, or `city` is required.

### `list_industries`

Lists the predefined industry categories usable in `search_leads`'s `industry` filter. Takes no arguments.

## Configuration

| Environment variable   | Required | Description                                                        |
| ----------------------- | -------- | -------------------------------------------------------------------- |
| `B2BLEADS_API_KEY`      | Yes      | Your B2BLeads API key.                                              |
| `B2BLEADS_API_URL`      | No       | Override the API base URL. Defaults to `https://api.b2bleadsapi.com`. |

## Pricing & rate limits

Each search consumes quota from your B2BLeads plan — see [pricing](https://b2bleadsapi.com/#pricing). Rate limits and quota errors are returned by the API and surfaced back to your agent as tool errors.

## Links

- [B2BLeads website](https://b2bleadsapi.com)
- [REST API documentation](https://b2bleadsapi.com/docs)
- [Terms of Use](https://b2bleadsapi.com/terms)
- [Privacy Policy](https://b2bleadsapi.com/privacy)

## License

MIT
