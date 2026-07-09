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
  Res,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { ChatQueryDto, CreateSessionDto } from '../dto/chat-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { CurrentUser, JwtUser } from '../../auth/controllers/auth.controller';
import { AuthService } from '../../auth/services/auth.service';
import { Request, Response } from 'express';
import {
  GUEST_MAX_SESSIONS,
  GUEST_MAX_MESSAGES,
  GuestLimitExceededException,
  setGuestAccessCookie,
} from '@app/common';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  private consumeGuestMessage(user: JwtUser, res: Response) {
    if (!user.isGuest) return;
    const messageCount = user.messageCount ?? 0;
    if (messageCount >= GUEST_MAX_MESSAGES) {
      throw new GuestLimitExceededException(
        'Guest message limit reached. Please log in to continue.',
      );
    }
    const token = this.authService.signGuestToken(
      user.userId,
      user.sessionCount ?? 0,
      messageCount + 1,
    );
    setGuestAccessCookie(res, token);
  }

  // GET /api/v1/chat/stream?query=...&sessionId=...
  // SSE endpoint — streams AI response chunks in real time
  @Sse('stream')
  streamQuery(
    @Query() dto: ChatQueryDto,
    @Req() req: Request & { user: JwtUser },
  ): Observable<MessageEvent> {
    this.consumeGuestMessage(req.user, req.res as Response);
    return this.chatService.streamQuery(dto, req.user.userId as string);
  }

  // POST /api/v1/chat/query
  // Main endpoint — parse query + find phones
  @Post('query')
  @HttpCode(HttpStatus.OK)
  async processQuery(
    @Body() dto: ChatQueryDto,
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.consumeGuestMessage(user, res);
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
    @Res({ passthrough: true }) res: Response,
  ) {
    if (user.isGuest) {
      const sessionCount = user.sessionCount ?? 0;
      if (sessionCount >= GUEST_MAX_SESSIONS) {
        throw new GuestLimitExceededException(
          'Guest chat limit reached. Please log in to start a new chat.',
        );
      }
      const token = this.authService.signGuestToken(
        user.userId,
        sessionCount + 1,
        user.messageCount ?? 0,
      );
      setGuestAccessCookie(res, token);
    }
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
