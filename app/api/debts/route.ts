import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Anda belum login" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // all | unsettled | settled
    const type = searchParams.get("type"); // all | owed_to_me | i_owe

    let query = supabase
      .from("debts")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter type (owed_to_me / i_owe)
    if (type === "owed_to_me" || type === "i_owe") {
      query = query.eq("type", type);
    }

    // Filter status
    if (status === "unsettled") {
      query = query.is("settled_at", null);
    } else if (status === "settled") {
      query = query.not("settled_at", "is", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/debts error:", error);
      return NextResponse.json({ error: "Gagal mengambil data utang" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (err) {
    console.error("GET /api/debts unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Anda belum login" }, { status: 401 });
    }

    const body = await req.json();
    const { type, counterpart_name, amount, due_date, note } = body;

    // Server-side validations
    if (!type || (type !== "owed_to_me" && type !== "i_owe")) {
      return NextResponse.json({ error: "Tipe harus diisi dengan 'owed_to_me' atau 'i_owe'" }, { status: 400 });
    }
    if (!counterpart_name || typeof counterpart_name !== "string" || counterpart_name.trim() === "") {
      return NextResponse.json({ error: "Nama orang/pihak terkait harus diisi" }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json({ error: "Jumlah harus berupa angka bulat Rupiah dan lebih besar dari 0" }, { status: 400 });
    }
    if (note && typeof note === "string" && note.length > 200) {
      return NextResponse.json({ error: "Catatan maksimal 200 karakter" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("debts")
      .insert({
        user_id: user.id, // Wajib dari session, bukan dari request body
        type,
        counterpart_name: counterpart_name.trim(),
        amount,
        note: note ? note.trim() : null,
        due_date: due_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error("POST /api/debts error:", error);
      return NextResponse.json({ error: "Gagal mencatat utang baru" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (err) {
    console.error("POST /api/debts unexpected error:", err);
    return NextResponse.json({ error: "Request tidak valid atau terjadi kesalahan server" }, { status: 500 });
  }
}
