export async function GET(request: Request): Promise<Response> {
  try {
    // Get current date and time
    const now = new Date();

    // Format the date and time
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = "00";

    const dateTime = `${year}${month}${day}${hour}${minute}${second}`;

    const url = `https://aplikace.policie.cz/dopravni-informace/GetFile.aspx?dt=${dateTime}`;
    const response = await fetch(url);

    const data = await response.text();

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal error", { status: 500 });
  }
}
