import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Anda belum login" }, { status: 401 });
    }

    const body = await req.json();
    const { type, counterpart_name, amount, due_date, note, settled_at } = body;
    const updates: Record<string, any> = {};

    // Validations (only check if provided in body)
    if (type !== undefined) {
      if (type !== "owed_to_me" && type !== "i_owe") {
        return NextResponse.json({ error: "Tipe harus diisi dengan 'owed_to_me' atau 'i_owe'" }, { status: 400 });
      }
      updates.type = type;
    }
    
    if (counterpart_name !== undefined) {
      if (typeof counterpart_name !== "string" || counterpart_name.trim() === "") {
        return NextResponse.json({ error: "Nama pihak terkait harus diisi" }, { status: 400 });
      }
      updates.counterpart_name = counterpart_name.trim();
    }

    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
        return NextResponse.json({ error: "Jumlah harus berupa angka bulat Rupiah dan lebih besar dari 0" }, { status: 400 });
      }
      updates.amount = amount;
    }

    if (note !== undefined) {
      if (note !== null && (typeof note !== "string" || note.length > 200)) {
        return NextResponse.json({ error: "Catatan maksimal 200 karakter" }, { status: 400 });
      }
      updates.note = note ? note.trim() : null;
    }

    if (due_date !== undefined) {
      updates.due_date = due_date || null;
    }

    if (settled_at !== undefined) {
      // settled_at bisa berisi null (belum lunas) atau string ISO (lunas)
      updates.settled_at = settled_at || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("debts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PATCH /api/debts/[id] error:", error);
      // RLS will prevent update if not owner, returning no rows (which `.single()` treats as error PGRST116)
      return NextResponse.json({ error: "Gagal mengubah data atau data tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (err) {
    console.error("PATCH /api/debts/[id] unexpected error:", err);
    return NextResponse.json({ error: "Request tidak valid atau terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Anda belum login" }, { status: 401 });
    }

    const { error } = await supabase
      .from("debts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE /api/debts/[id] error:", error);
      return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
    }
    
    // RLS handles returning error/nothing if doesn't belong to user
    // (Note: Supabase delete() without select() doesn't error if 0 rows deleted, 
    // but the task just says to delete. The HTTP 204 indicates success.)
    
    return new NextResponse(null, { status: 204 });

  } catch (err) {
    console.error("DELETE /api/debts/[id] unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
