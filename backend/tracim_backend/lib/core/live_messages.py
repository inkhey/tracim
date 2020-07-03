import json
import typing

from gripcontrol import GripPubControl

# TODO - G.M - 2020-05-14 - Use default event "message" for TLM to be usable with
# "onmessage" EventSource Object in javascript.
from tracim_backend import CFG
from tracim_backend.models.event import Message
from tracim_backend.views.core_api.schemas import LiveMessageSchema

TLM_EVENT_NAME = "message"
STREAM_OPENED_EVENT_NAME = "stream-opened"
KEEPALIVE_EVENT_NAME = "keepalive"
AVAST_FIX_EVENT_NAME = "avast-fix"


class JsonServerSideEvent(object):
    """Create a ServerSideEvent with single-line json as data"""

    def __init__(
        self, data: typing.Dict[str, typing.Any], event: typing.Optional[str] = None,
    ):
        self.data = data
        self.event = event

    def __str__(self):
        buffer = ""
        if self.event:
            buffer += "event: {}\n".format(self.event)
        buffer += "data: {}\n".format(json.dumps(self.data))
        buffer += "\n"
        return buffer


class LiveMessagesLib(object):
    def __init__(self, config: CFG,) -> None:
        self.control_uri = config.LIVE_MESSAGES__CONTROL_URI
        self.grip_pub_control = GripPubControl({"control_uri": self.control_uri})

    def publish_message_to_user(self, message: Message):
        channel_name = "user_{}".format(message.receiver_id)
        message_schema = LiveMessageSchema()
        message_as_dict = message_schema.dump(message).data
        self.grip_pub_control.publish_http_stream(
            channel_name, str(JsonServerSideEvent(data=message_as_dict, event=TLM_EVENT_NAME))
        )
        self.grip_pub_control.wait_all_sent()
        # INFO SG 2020-07-03 - Needed for Avast WebShield on macOs
        # If not present the message is received by the browser
        # when the next keep-alive event is received
        self.grip_pub_control.publish_http_stream(
            channel_name, "event:{}\ndata:\n\n".format(AVAST_FIX_EVENT_NAME)
        )
