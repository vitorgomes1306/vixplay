<?php
$chave = "4E3JD1";
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIX MIDIA - Display</title>
    <script>
        document.addEventListener('contextmenu', function (e) {
            e.preventDefault(); // impede o menu do botão direito
        });
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="vix_display.css">
    <link rel="icon" type="image/png" href="ARENA ON_simbolo2.png">
</head>



<body>
    <div class="container">
        <div class="item">


            <div class="div_form">
                <div class="key-container">
                    <?php
                    for ($i = 0; $i < strlen($chave); $i++) {
                        echo '<div class="key">' . $chave[$i] . '</div>';
                    }
                    ?>
                </div>

            </div>

        </div>
        <div class="item">

            <div class="div_logo"><img src="logo_sendd_ft.png" alt="" height="200px" class="logo-animada"></div>


            <div class="div_sauldacao">
                <h1 style="color: #ccc;">Terminal não cadastrado. Cadastre no painel administrativo
                    com a chave ao lado </h1>
            </div>



        </div>
    </div>

    </div>
</body>

</html>