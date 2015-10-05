<?php

$url = 'http://example.com:22766/test/user@example.com';

$application_shortname = 'example';

$application_apikey = 'example-api-key';

$response = http_get($url.'?application_shortname='.$application_shortname.
                          '&application_apikey='.$application_apikey,
                          array('timeout'=>30),
                          $responseInfo);

if($responseInfo['response_code'] == 200 && $responseInfo['content_type'] == 'application/json') {
  $responseJSON = json_decode($response, true); // Set to false to get objects

  // Do stuff with the data!

} else {
  throw new Exception("Something went wrong!", 1);
}

