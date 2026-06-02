import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
  Req,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { ChatQueryDto, CreateSessionDto } from '../dto/chat-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { CurrentUser, JwtUser } from '../../auth/controllers/auth.controller';
import { Request } from 'express';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // GET /api/v1/chat/stream?query=...&sessionId=...
  // SSE endpoint — streams AI response chunks in real time
  @Sse('stream')
  streamQuery(
    @Query() dto: ChatQueryDto,
    @Req() req: Request & { user: JwtUser },
  ): Observable<MessageEvent> {
    return this.chatService.streamQuery(dto, req.user.userId as string);
  }

  // POST /api/v1/chat/query
  // Main endpoint — parse query + find phones
  @Post('query')
  @HttpCode(HttpStatus.OK)
  async processQuery(@Body() dto: ChatQueryDto, @CurrentUser() user: JwtUser) {
    const result = await this.chatService.processQuery(
      dto,
      user.userId as string,
    );
    return {
      message: 'Query processed successfully',
      data: result,
    };
  }

  // POST /api/v1/chat/parse
  // Just parse — for testing
  @Post('parse')
  @HttpCode(HttpStatus.OK)
  async parseQuery(@Body('query') query: string) {
    const result = await this.chatService.parseQuery(query);
    return {
      message: 'Query parsed successfully',
      data: result,
    };
  }

  // POST /api/v1/chat/classify
  // Classify query intent
  @Post('classify')
  @HttpCode(HttpStatus.OK)
  async classifyQuery(@Body('query') query: string) {
    const result = await this.chatService.classifyQuery(query);
    return {
      message: 'Query classified',
      data: result,
    };
  }

  // POST /api/v1/chat/sessions
  // Create new chat session
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: JwtUser,
  ) {
    const result = await this.chatService.createSession(
      user.userId as string,
      dto,
    );
    return {
      message: 'Session created successfully',
      data: result,
    };
  }

  // GET /api/v1/chat/sessions
  // Get all sessions for current user
  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getUserSessions(@CurrentUser() user: JwtUser) {
    const result = await this.chatService.getUserSessions(
      user.userId as string,
    );
    return {
      message: 'Sessions fetched successfully',
      data: result,
    };
  }

  // GET /api/v1/chat/sessions/:id/messages
  // Get all messages for a session
  @Get('sessions/:id/messages')
  @HttpCode(HttpStatus.OK)
  async getSessionMessages(@Param('id') sessionId: string) {
    const result = await this.chatService.getSessionMessages(sessionId);
    return {
      message: 'Messages fetched successfully',
      data: result,
    };
  }
}
