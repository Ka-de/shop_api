import { Body, CacheKey, Controller, Delete, Get, HttpStatus, Patch, Put, UploadedFile, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiHeader, ApiResponse, PickType } from '@nestjs/swagger';
import { JoiValidationPipe } from '../../pipes/joi-validation.pipe';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { ErrorResponse } from '../../errors/error.response';
import { AuthenticationGuard } from '../../guards/authentication.guard';
import { AuthorizeGuard } from '../../guards/authorize.guard';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UsersService } from '../users/users.service';
import { UpdateProfileValidator } from './validators/update-profile.validator';
import { ResponseSchema } from '../../shared/response.schema';
import { UserResponse } from '../users/responses/user.response';
import { Storage } from '../../shared/storage';
import { FileValidator } from '../../shared/file.validator';
import { CacheClear } from '../../decorators/cache-clear.decorator';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { CacheFilter } from '../../decorators/cache-filter.decorator';
import * as Joi from 'joi';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly usersService: UsersService
  ) {}

  @ApiHeader({ name: 'token', required: true }) 
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: UserResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheKey(RedisCacheKeys.GET_USER)
  @CacheFilter('token')
  @Get()
  getProfile(
    @CurrentUser('_id') id: string
  ) {
    return this.usersService.getUser(id);
  }

  @ApiHeader({ name: 'token', required: true })
  @ApiHeader({ name: 'password', required: true })
  @UseGuards(AuthorizeGuard, AuthenticationGuard)
  @ApiResponse({ status: HttpStatus.OK, type: UserResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_USERS, RedisCacheKeys.GET_USER)
  @Patch()
  updateProfile(
    @Body(new JoiValidationPipe(UpdateProfileValidator)) updateUserDto: UpdateUserDto,
    @CurrentUser('_id') id: string
  ) {    
    return this.usersService.updateUser(id, updateUserDto);
  }

  @ApiHeader({ name: 'token', required: true })
  @ApiHeader({ name: 'password', required: true })
  @UseGuards(AuthorizeGuard, AuthenticationGuard)
  @ApiResponse({ status: HttpStatus.OK, type: PickType(ResponseSchema, ['success']) })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_USERS, RedisCacheKeys.GET_USER)
  @Delete()
  removeProfie(
    @CurrentUser('_id') id: string,
  ){
    return this.usersService.removeUser(id);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: PickType(ResponseSchema, ['success']) })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @UseInterceptors(Storage.upload('image', 1))
  @Patch('image')
  uploadImage(
    @UploadedFile(new JoiValidationPipe(FileValidator.One)) file: any,
    @CurrentUser('_id') id: string,
  ){    
    return this.usersService.uploadImage(id, file);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: ResponseSchema<String[]> })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheKey(RedisCacheKeys.GET_CART)
  @Get('cart')
  getCart(
    @CurrentUser('_id') id: string
  ) {        
    return this.usersService.getCart(id);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: ResponseSchema<String[]> })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.GET_CART)
  @Put('cart')
  addToCart(
    @Body('items', new JoiValidationPipe(Joi.array().min(1).required())) items: string[],
    @CurrentUser('_id') id: string
  ) {    
    return this.usersService.addToCart(id, items);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: ResponseSchema<String[]> })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.GET_CART)
  @Delete('cart')
  removeFromCart(
    @Body('items', new JoiValidationPipe(Joi.array().min(1).required())) items: string[],
    @CurrentUser('_id') id: string
  ) {        
    return this.usersService.removeFromCart(id, items);
  }
}
