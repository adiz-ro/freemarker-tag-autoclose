<#ftl output_format="HTML">
<#-- Fisier de proba: FreeMarker + HTML + JavaScript + CSS in acelasi loc. -->

<#assign titlu = "Raport">
<#assign produse = [{"nume": "A", "pret": 10}, {"nume": "B", "pret": 25}]>

<#macro rand produs index>
  <tr class="<#if index % 2 == 0>par<#else>impar</#if>">
    <td>${produs.nume?upper_case}</td>
    <td>${produs.pret?string.currency}</td>
  </tr>
</#macro>

<!DOCTYPE html>
<html lang="ro">
<head>
  <title>${titlu!"Fara titlu"}</title>
  <style>
    .par { background: #f5f5f5; }
    .impar { background: #ffffff; }
  </style>
</head>
<body>
  <h1>${titlu}</h1>

  <#if produse?has_content>
    <table data-count="${produse?size}">
      <#list produse as p>
        <@rand produs=p index=p?index />
      <#sep>
      </#list>
    </table>
  <#else>
    <p>Nu exista produse.</p>
  </#if>

  <#-- '>' din paranteze nu trebuie sa inchida tagul -->
  <#if (produse?size > 1)>
    <p>Mai multe produse.</p>
  </#if>

  <script>
    const produse = [
      <#list produse as p>
      { nume: "${p.nume?js_string}", pret: ${p.pret} }<#sep>,</#sep>
      </#list>
    ];

    <#if produse?size gt 0>
    console.log("incarcate", produse.length);
    </#if>

    function total() {
      return produse.reduce((acc, p) => acc + p.pret, 0);
    }
  </script>
</body>
</html>
