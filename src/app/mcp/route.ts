import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import {
  createTodo,
  createTodoSchema,
  deleteTodo,
  getTodo,
  listTodos,
  todoIdSchema,
  updateTodo,
  updateTodoSchema,
} from "@/lib/todos";

function result(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function failure(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

type ToolResponse = ReturnType<typeof result> | ReturnType<typeof failure>;

async function runTool(
  operation: () => Promise<ToolResponse>,
): Promise<ToolResponse> {
  try {
    return await operation();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
    return failure(message);
  }
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    "list_todos",
    {
      title: "Pobierz wszystkie todo",
      description: "Zwraca tablice elementow todo.",
      inputSchema: z.object({}),
    },
    async () => runTool(async () => result(await listTodos())),
  );

  server.registerTool(
    "get_todo",
    {
      title: "Pobierz pojedyncze todo",
      description: "Zwraca pojedynczy element todo na podstawie ID.",
      inputSchema: z.object({ id: todoIdSchema }),
    },
    async ({ id }) =>
      runTool(async () => {
        const todo = await getTodo(id);
        if (!todo) return failure("Todo nie zostało znalezione.");
        return result(todo);
      }),
  );

  server.registerTool(
    "create_todo",
    {
      title: "Utwórz nowe todo",
      description: "Tworzy nowy element todo z podanym tytułem.",
      inputSchema: createTodoSchema,
    },
    async (input) => runTool(async () => result(await createTodo(input))),
  );

  server.registerTool(
    "update_todo",
    {
      title: "Zaktualizuj todo",
      description: "Aktualizuje istniejący element todo.",
      inputSchema: z.object({ id: todoIdSchema, input: updateTodoSchema }),
    },
    async ({ id, input }) =>
      runTool(async () => {
        const todo = await updateTodo(id, input);
        if (!todo) return failure("Todo nie zostało znalezione.");
        return result(todo);
      }),
  );

  server.registerTool(
    "delete_todo",
    {
      title: "Usuń todo",
      description: "Usuwa istniejący element todo na podstawie ID.",
      inputSchema: z.object({ id: todoIdSchema }),
    },
    async ({ id }) =>
      runTool(async () => {
        const deleted = await deleteTodo(id);
        if (!deleted) return failure("Todo nie zostało znalezione.");
        return result({ success: true, message: "Todo zostało usunięte." });
      }),
  );
});

export { handler as GET, handler as POST };
