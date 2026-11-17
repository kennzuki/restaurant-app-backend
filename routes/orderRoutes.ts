import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const placeOrderSchema = z
  .object({
    customerName: z.string().trim().min(1).max(120),
    customerEmail: z.string().trim().email().max(254).optional(),
    note: z.string().trim().max(1000).optional(),
    items: z
      .array(
        z.object({
          menuItemId: z.string().trim().min(1),
          quantity: z.number().int().min(1).max(50),
        }),
      )
      .min(1)
      .max(25),
  })
  .strict()
  .refine(
    (order) => new Set(order.items.map((item) => item.menuItemId)).size === order.items.length,
    { message: "Each menu item can only appear once; set its quantity instead.", path: ["items"] },
  );

class UnavailableMenuItemsError extends Error {}

router.post("/", async (req, res, next) => {
  const parsed = placeOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid order", details: parsed.error.flatten() });
    return;
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const requestedItems = parsed.data.items;
      const menuItems = await tx.menuItem.findMany({
        where: {
          id: { in: requestedItems.map((item) => item.menuItemId) },
          available: true,
        },
      });

      if (menuItems.length !== requestedItems.length) {
        throw new UnavailableMenuItemsError();
      }

      const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
      const totalCents = requestedItems.reduce((total, requestedItem) => {
        const menuItem = menuItemById.get(requestedItem.menuItemId)!;
        const unitPriceCents = Number(
          menuItem.price.mul(100).toDecimalPlaces(0).toString(),
        );
        return total + unitPriceCents * requestedItem.quantity;
      }, 0);

      return tx.order.create({
        data: {
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail,
          note: parsed.data.note,
          total: (totalCents / 100).toFixed(2),
          items: {
            create: requestedItems.map((requestedItem) => {
              const menuItem = menuItemById.get(requestedItem.menuItemId)!;
              return {
                quantity: requestedItem.quantity,
                unitPrice: menuItem.price.toString(),
                menuItem: { connect: { id: menuItem.id } },
              };
            }),
          },
        },
        include: {
          items: {
            include: { menuItem: true },
          },
        },
      });
    });

    res.status(201).json({ order });
  } catch (error) {
    if (error instanceof UnavailableMenuItemsError) {
      res.status(409).json({ error: "One or more menu items are unavailable or missing." });
      return;
    }
    next(error);
  }
});

export default router;
