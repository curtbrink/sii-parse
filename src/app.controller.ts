import { Body, Controller, Param, Post } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post(':day')
  async parseSII(@Param('day') dayToSearch: number, @Body() body: string) {
    return this.appService.parseSII(body, dayToSearch);
  }
}
