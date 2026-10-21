import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. AUTHENTICATION: Validate the developer's API key at the Gateway edge
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.GRAAS_SERVER_API_KEY;
    
    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized: Invalid API key" }, { status: 401 });
    }

    const body = await req.json();
    const { workflow, inputs } = body;

    if (!workflow || !inputs) {
      return NextResponse.json({ error: "Missing 'workflow' or 'inputs'" }, { status: 400 });
    }

    // 2. FORWARD TO BACKEND: The perfected executor.cjs with Governance Boundary
    // 🔑 FIX 1: Default to 3101 (the Executor), not 3000 (the Gateway)
    const backendUrl = process.env.GRAAS_BACKEND_URL || "http://localhost:3101";
    const executionEndpoint = `${backendUrl}/execute`; 
    
    console.log(`\n[GRaaS Gateway] 🌐 Forwarding request to: ${executionEndpoint}`);

    const response = await fetch(executionEndpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ workflow, inputs }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GRaaS Gateway] ❌ Backend returned ${response.status}:`, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const kernelResult = await response.json();

    // 3. METERING: Log the billable event (The "Stripe" layer)
    const billableEvent = {
      customerId: "cust_local_test", 
      executionId: kernelResult.__audit?.executionId,
      workflowName: kernelResult.__audit?.workflowName || "unknown",
      timestamp: kernelResult.__audit?.timestamp,
      merkleRoot: kernelResult.__audit?.merkleRoot,
      status: "success",
      cost: 0.0001, 
      currency: "USD"
    };

    console.log("💰 [GRaaS Gateway] Real billable event logged:", billableEvent);

    // 4. RESPONSE: Return the result + crypto audit + billing receipt to the client
    return NextResponse.json({
      ok: true,
      // 🔑 FIX 2: Check for kyc_result and sum, not just response/output
      result: kernelResult.kyc_result || kernelResult.sum || kernelResult.response || kernelResult.output,
      audit: kernelResult.__audit,
      billing: {
        charged: true,
        cost: billableEvent.cost,
        executionId: billableEvent.executionId
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("[GRaaS Gateway] 💥 Execution failed:", error.message);
    return NextResponse.json(
      { ok: false, error: "Execution failed", details: error.message },
      { status: 500 }
    );
  }
}