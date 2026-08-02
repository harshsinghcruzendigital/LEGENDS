import { hasDatabase, getPrisma } from "@/server/db";
import { Prisma } from "@prisma/client";

export interface SavedViewPayload {
  id: string;
  userId: string;
  name: string;
  filters: any;
  columns: any;
  sorting: any;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Global in-memory array for mock fallback
let MOCK_SAVED_VIEWS: SavedViewPayload[] = [
  {
    id: "default_qualified",
    userId: "mock_user",
    name: "Qualified Leads (Score ≥ 80)",
    filters: { search: "", stages: [], websiteStatuses: [], industries: [], scorePreset: "80", verifiedOnly: true },
    columns: ["company", "websiteStatus", "leadScore", "websiteScore", "opportunityType", "location", "stage", "assignedTo", "createdAt"],
    sorting: [{ id: "leadScore", desc: true }],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const savedViewsRepository = {
  async list(userId: string): Promise<SavedViewPayload[]> {
    if (!hasDatabase) {
      return MOCK_SAVED_VIEWS.filter((v) => v.userId === userId || v.userId === "mock_user");
    }

    const prisma = getPrisma();
    const rows = await prisma.savedView.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      filters: r.filters,
      columns: r.columns,
      sorting: r.sorting,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },

  async create(
    userId: string,
    input: { name: string; filters: any; columns: any; sorting: any; isDefault: boolean }
  ): Promise<SavedViewPayload> {
    if (!hasDatabase) {
      // If setting default, unset others
      if (input.isDefault) {
        MOCK_SAVED_VIEWS = MOCK_SAVED_VIEWS.map((v) =>
          v.userId === userId || v.userId === "mock_user" ? { ...v, isDefault: false } : v
        );
      }
      const created: SavedViewPayload = {
        id: `sv_${Date.now().toString(36)}`,
        userId,
        name: input.name,
        filters: input.filters,
        columns: input.columns,
        sorting: input.sorting,
        isDefault: input.isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      MOCK_SAVED_VIEWS.push(created);
      return created;
    }

    const prisma = getPrisma();
    if (input.isDefault) {
      await prisma.savedView.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const created = await prisma.savedView.create({
      data: {
        userId,
        name: input.name,
        filters: input.filters as Prisma.InputJsonValue,
        columns: input.columns as Prisma.InputJsonValue,
        sorting: input.sorting as Prisma.InputJsonValue,
        isDefault: input.isDefault,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      name: created.name,
      filters: created.filters,
      columns: created.columns,
      sorting: created.sorting,
      isDefault: created.isDefault,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  async update(
    userId: string,
    id: string,
    input: { name?: string; filters?: any; columns?: any; sorting?: any; isDefault?: boolean }
  ): Promise<SavedViewPayload | null> {
    if (!hasDatabase) {
      const idx = MOCK_SAVED_VIEWS.findIndex((v) => v.id === id);
      if (idx === -1) return null;

      if (input.isDefault) {
        MOCK_SAVED_VIEWS = MOCK_SAVED_VIEWS.map((v) =>
          v.userId === userId || v.userId === "mock_user" ? { ...v, isDefault: false } : v
        );
      }

      const existing = MOCK_SAVED_VIEWS[idx];
      const updated: SavedViewPayload = {
        ...existing,
        name: input.name !== undefined ? input.name : existing.name,
        filters: input.filters !== undefined ? input.filters : existing.filters,
        columns: input.columns !== undefined ? input.columns : existing.columns,
        sorting: input.sorting !== undefined ? input.sorting : existing.sorting,
        isDefault: input.isDefault !== undefined ? input.isDefault : existing.isDefault,
        updatedAt: new Date(),
      };
      MOCK_SAVED_VIEWS[idx] = updated;
      return updated;
    }

    const prisma = getPrisma();
    const existing = await prisma.savedView.findFirst({ where: { id, userId } });
    if (!existing) return null;

    if (input.isDefault) {
      await prisma.savedView.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const data: Prisma.SavedViewUpdateInput = { updatedAt: new Date() };
    if (input.name !== undefined) data.name = input.name;
    if (input.filters !== undefined) data.filters = input.filters as Prisma.InputJsonValue;
    if (input.columns !== undefined) data.columns = input.columns as Prisma.InputJsonValue;
    if (input.sorting !== undefined) data.sorting = input.sorting as Prisma.InputJsonValue;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;

    const updated = await prisma.savedView.update({
      where: { id },
      data,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      filters: updated.filters,
      columns: updated.columns,
      sorting: updated.sorting,
      isDefault: updated.isDefault,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },

  async delete(userId: string, id: string): Promise<boolean> {
    if (!hasDatabase) {
      const initialLength = MOCK_SAVED_VIEWS.length;
      MOCK_SAVED_VIEWS = MOCK_SAVED_VIEWS.filter((v) => v.id !== id);
      return MOCK_SAVED_VIEWS.length < initialLength;
    }

    const prisma = getPrisma();
    const existing = await prisma.savedView.findFirst({ where: { id, userId } });
    if (!existing) return false;

    await prisma.savedView.delete({ where: { id } });
    return true;
  },
};
