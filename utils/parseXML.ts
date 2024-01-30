import xml2js from "xml2js";

export type parsedItem = {
  MTXT?: string;
  StartTime?: string;
  EndTime?: string;
  OTXT?: string;
  TXPL?: string;
  SBEG?: { x: string; y: string };
};

export const parseXmlAndExtractTag = async (
  xmlData: string,
): Promise<parsedItem[]> => {
  const parser = new xml2js.Parser({ explicitArray: false });
  let result;
  try {
    result = await parser.parseStringPromise(xmlData);
  } catch (error) {
    console.error("Error parsing XML:", error);
    return [];
  }

  if (!result?.DInfo?.XML) {
    console.error("Unexpected XML structure:", result);
    return [];
  }

  const xmlArray = Array.isArray(result.DInfo.XML)
    ? result.DInfo.XML
    : [result.DInfo.XML];
  const parsedItems: parsedItem[] = [];

  xmlArray.forEach((xmlEntry: any) => {
    if (xmlEntry?.DOC?.MJD?.MSG) {
      const msgs = Array.isArray(xmlEntry.DOC.MJD.MSG)
        ? xmlEntry.DOC.MJD.MSG
        : [xmlEntry.DOC.MJD.MSG];
      msgs.forEach((msg: any) => {
        const parsedItem: parsedItem = {};

        if (msg?.MTXT?._) {
          parsedItem.MTXT = msg.MTXT._;
        }
        if (msg?.MTIME?.TSTA?.$) {
          const startDate = msg.MTIME.TSTA.$.date || "defaultDate";
          const startTime = msg.MTIME.TSTA.$.time || "defaultTime";
          parsedItem.StartTime = `${startDate} ${startTime}`;
        }
        if (msg?.MTIME?.TSTO?.$) {
          const endDate = msg.MTIME.TSTO.$.date || "defaultDate";
          const endTime = msg.MTIME.TSTO.$.time || "defaultTime";
          parsedItem.EndTime = `${endDate} ${endTime}`;
        }
        if (msg?.MEVT?.OTXT?._) {
          parsedItem.OTXT = msg.MEVT.OTXT._;
        }
        if (msg?.MLOC?.TXPL) {
          parsedItem.TXPL = msg.MLOC.TXPL;
        }
        if (msg?.MLOC?.SNTL?.SBEG) {
          parsedItem.SBEG = {
            x: msg.MLOC.SNTL.SBEG.x,
            y: msg.MLOC.SNTL.SBEG.y,
          };
        }

        parsedItems.push(parsedItem);
      });
    }
  });

  return parsedItems;
};
