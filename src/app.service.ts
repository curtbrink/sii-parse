import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  private parseSingleLine(line: string) {
    const split = line.split(':').map((it) => it.trim());
    return {
      name: split[0],
      value: split[1],
    };
  }

  parseSII(rawString: string, dayToSearch: number) {
    const siiLines = rawString.split('\n');
    const siiLinesWithIndex = siiLines.map((line, idx) => ({ idx, line }));

    const searchTerm = `timestamp_day: ${dayToSearch}`;

    const jobEntriesForDay = [];

    for (const { idx, line } of siiLinesWithIndex) {
      if (line.includes(searchTerm)) {
        const jobEntry: any = {};
        // we hit a log entry for the right day. now figure out the deets.
        const parsedTimestamp = this.parseSingleLine(line);
        jobEntry[parsedTimestamp.name] = parsedTimestamp.value;

        let hitProfitLogEntryLine = false;
        let parserIdx = idx;
        while (!hitProfitLogEntryLine) {
          parserIdx--;
          const parsedLine = siiLines[parserIdx];
          if (parsedLine.includes('profit_log_entry')) {
            hitProfitLogEntryLine = true;
            jobEntry['entry_name'] = parsedLine
              .split(':')[1]
              .replace('{', '')
              .trim();
          } else {
            const parsed = this.parseSingleLine(siiLines[parserIdx]);
            jobEntry[parsed.name] = parsed.value;
          }
        }

        jobEntriesForDay.push(jobEntry);
      }
    }

    for (const jobEntry of jobEntriesForDay) {
      const referenceLine = siiLinesWithIndex.find((it) => it.line.includes(jobEntry.entry_name) && it.line.includes('stats_data'));
      if (!referenceLine) {
        console.log('oops');
        continue;
      }

      let parserIdx = referenceLine.idx;
      let foundProfitLog = false;
      while (!foundProfitLog) {
        parserIdx--;
        if (siiLines[parserIdx].includes('profit_log :')) {
          foundProfitLog = true;
          jobEntry.profit_log_name = siiLines[parserIdx]
            .split(':')[1]
            .replace('{', '')
            .trim();
        }
      }

      console.log(`Entry [${jobEntry.entry_name}] => profit log [${jobEntry.profit_log_name}]`);

      const profitLogReferenceLine = siiLinesWithIndex.find((it) => it.line.includes(jobEntry.profit_log_name) && !it.line.includes('profit_log :'));
      if (!profitLogReferenceLine) {
        console.log('whoopsies');
        continue;
      }

      if (profitLogReferenceLine.line.includes('truck_profit_logs')) {
        console.log('entry is for a truck profit log, skipping');
        continue;
      }

      let logParseIdx = profitLogReferenceLine.idx;
      let foundRelevantLine = false;
      while (!foundRelevantLine) {
        logParseIdx--;
        const theLine = siiLines[logParseIdx];
        if (theLine.includes('garage :') || theLine.includes('driver_player :')) {
          console.log('entry is for player profit log, skipping');
          foundRelevantLine = true;
        } else if (theLine.includes('driver_ai :')) {
          foundRelevantLine = true;
          jobEntry.driver_id = theLine.split(':')[1].replace('{', '').trim();
        }
      }
    }

    const driverJobs = jobEntriesForDay.filter((it) => it.driver_id);
    let resultTable = '';
    for (const driverEntry of driverJobs) {
      const profit = parseInt(driverEntry.revenue) - parseInt(driverEntry.wage) - parseInt(driverEntry.maintenance) - parseInt(driverEntry.fuel);
      resultTable += `${driverEntry.driver_id}|${driverEntry.source_city}|${driverEntry.destination_city}|${driverEntry.cargo}|${driverEntry.distance}|${profit}\n`;
    }
    return resultTable;
  }
}
