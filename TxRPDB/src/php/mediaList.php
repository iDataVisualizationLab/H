<?php
// get the q parameter from URL
$si = $_REQUEST["sectionid"];
$ct = $_REQUEST["contenttype"];

if ($si!=='' && $ct!=='') {
    $si = strtolower($si);
    $ct = strtolower($ct);

    getcwd();
    echo  chdir("..");
    chdir("data");
    echo  getcwd();
    $d = dir(getcwd());
    while (($file = $d->read()) !== false){
      echo "filename: " . $file . "<br>";
    }
}
$myObj->name = "John";
$myObj->age = 30;
$myObj->city = "New York";

$myJSON = json_encode($myObj);

echo $myJSON;
?>