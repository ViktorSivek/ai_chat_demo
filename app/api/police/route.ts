export async function GET(request: Request): Promise<Response> {
  try {
    // Get current date and time
    const now = new Date();

    console.log("now", now);

    // Format the date and time
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = "00";

    const dateTime = `${year}${month}${day}${hour}${minute}${second}`;

    console.log("dateTime", dateTime);

    const url = `https://aplikace.policie.cz/dopravni-informace/GetFile.aspx?dt=${dateTime}`;
    const response = await fetch(url);

    console.log("response" ,response);

    const data = await response.text();

    console.log("data" ,data);

    return new Response(JSON.stringify({ data }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal error", { status: 500 });
  }
}
