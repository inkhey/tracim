# coding=utf-8
from sqlalchemy.orm.exc import NoResultFound

from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.lib.core.user import UserApi
from tracim.views.controllers import Controller
from pyramid.config import Configurator

from tracim.views.core_api.schemas import UserSchema, OkResponse
from tracim.views.core_api.schemas import LoginOutputHeaders
from tracim.views.core_api.schemas import BasicAuthSchema
from tracim.exceptions import NotAuthentificated, LoginFailed

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


class SessionController(Controller):

    @hapic.with_api_doc()
    @hapic.input_headers(LoginOutputHeaders())
    @hapic.input_query(BasicAuthSchema())
    @hapic.handle_exception(LoginFailed, http_code=HTTPStatus.BAD_REQUEST)
    # TODO - G.M - 17-04-2018 - fix output header ?
    # @hapic.output_headers()
    @hapic.output_body(OkResponse())
    def login(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs user into the system
        """
        email = request.params['email']
        password = request.params['password']
        if not (email and password):
            raise Exception
        app_config = request.registry.settings['CFG']
        try:
            uapi = UserApi(
                None,
                session=request.dbsession,
                config=app_config,
            )
            user = uapi.get_one_by_email(email)
            valid_password = user.validate_password(password)
            if not valid_password:
                # Bad password
                raise LoginFailed('Bad Credentials')
        except NoResultFound:
            # User does not exist
            raise LoginFailed('Bad Credentials')
        return {'message': 'ok'}

    @hapic.with_api_doc()
    @hapic.output_body(OkResponse())
    def logout(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs out current logged in user session
        """
        return {'message': 'ok'}

    @hapic.with_api_doc()
    @hapic.handle_exception(
        NotAuthentificated,
        http_code=HTTPStatus.UNAUTHORIZED
    )
    @hapic.output_body(
        UserSchema(),
        default_http_code=HTTPStatus.OK,
    )
    def whoami(self, context, request: TracimRequest, hapic_data=None):
        """
        Return current logged in user or 401
        """
        return request.current_user

    def bind(self, configurator: Configurator):

        # Login
        configurator.add_route(
            'login',
            '/sessions/login',
            request_method='GET'
        )
        configurator.add_view(
            self.login,
            route_name='login',
            renderer='json'
        )
        # Logout
        configurator.add_route(
            'logout',
            '/sessions/logout',
            request_method='GET'
        )

        configurator.add_view(
            self.logout,
            route_name='logout',
            renderer='json'

        )
        # Whoami
        configurator.add_route(
            'whoami',
            '/sessions/whoami',
            request_method='GET'
        )
        configurator.add_view(
            self.whoami,
            route_name='whoami',
            renderer='json'
        )
